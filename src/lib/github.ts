const GRAPHQL_URL = "https://api.github.com/graphql";
const REST_URL = "https://api.github.com";

export class GitHubError extends Error {
  constructor(message: string, public status: number = 500) {
    super(message);
  }
}

function token(): string {
  const t = process.env.GITHUB_TOKEN;
  if (!t) {
    throw new GitHubError(
      "GITHUB_TOKEN is not set. Add it as a secret on the Worker (or in .env.local for local dev).",
      500,
    );
  }
  return t;
}

function headers() {
  return {
    Authorization: `Bearer ${token()}`,
    "Content-Type": "application/json",
    "User-Agent": "specsheet",
    Accept: "application/vnd.github+json",
  };
}

export interface GhRepo {
  name: string;
  description: string | null;
  url: string;
  homepageUrl: string | null;
  stargazerCount: number;
  forkCount: number;
  diskUsage: number | null;
  pushedAt: string | null;
  createdAt: string;
  primaryLanguage: { name: string; color: string | null } | null;
  languages: { edges: { size: number; node: { name: string; color: string | null } }[] };
  deployments: { totalCount: number };
  releases: { totalCount: number };
}

export interface GhUser {
  login: string;
  name: string | null;
  avatarUrl: string;
  location: string | null;
  createdAt: string;
  followers: { totalCount: number };
  repositoriesContributedTo: { totalCount: number };
  contributionsCollection: {
    totalCommitContributions: number;
    totalPullRequestContributions: number;
    totalPullRequestReviewContributions: number;
    totalIssueContributions: number;
    restrictedContributionsCount: number;
    contributionCalendar: {
      totalContributions: number;
      weeks: { contributionDays: { date: string; contributionCount: number; weekday: number }[] }[];
    };
  };
  repositories: { totalCount: number; nodes: GhRepo[] };
}

// Split into three small queries run in parallel: one big query (100 repos × languages × deployments)
// regularly hits GitHub's ~10s timeout and comes back as a 502.
const PROFILE_QUERY = /* GraphQL */ `
  query Profile($login: String!) {
    user(login: $login) {
      login
      name
      avatarUrl(size: 400)
      location
      createdAt
      followers { totalCount }
      repositoriesContributedTo(first: 1, contributionTypes: [COMMIT, PULL_REQUEST], includeUserRepositories: false) { totalCount }
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalIssueContributions
        restrictedContributionsCount
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount weekday } }
        }
      }
    }
  }
`;

const REPOS_QUERY = /* GraphQL */ `
  query Repos($login: String!) {
    user(login: $login) {
      repositories(first: 60, ownerAffiliations: OWNER, isFork: false, orderBy: { field: STARGAZERS, direction: DESC }) {
        totalCount
        nodes {
          name
          description
          url
          homepageUrl
          stargazerCount
          forkCount
          diskUsage
          pushedAt
          createdAt
          primaryLanguage { name color }
          languages(first: 5, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name color } } }
        }
      }
    }
  }
`;

// Deployment/release counts are the slowest part; if this one fails we just treat them as 0.
const SHIPPING_QUERY = /* GraphQL */ `
  query Shipping($login: String!) {
    user(login: $login) {
      repositories(first: 30, ownerAffiliations: OWNER, isFork: false, orderBy: { field: STARGAZERS, direction: DESC }) {
        nodes { name deployments { totalCount } releases { totalCount } }
      }
    }
  }
`;

type GqlResult<T> = { data?: { user: T | null }; errors?: { type?: string; message: string }[] };

async function gql<T>(query: string, login: string, attempt = 0): Promise<GqlResult<T>> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ query, variables: { login } }),
    cache: "no-store",
  });
  if ((res.status === 502 || res.status === 504) && attempt === 0) return gql<T>(query, login, 1);
  if (!res.ok) throw new GitHubError(`GitHub API returned ${res.status}`, res.status);
  return (await res.json()) as GqlResult<T>;
}

function check<T>(r: GqlResult<T>, login: string): T {
  if (r.errors?.some((e) => e.type === "NOT_FOUND") || (r.data && !r.data.user)) {
    throw new GitHubError(`No GitHub user called "${login}"`, 404);
  }
  if (r.errors?.length && !r.data?.user) throw new GitHubError(r.errors.map((e) => e.message).join("; "), 502);
  return r.data!.user!;
}

type RepoNode = Omit<GhRepo, "deployments" | "releases">;

export async function fetchUser(login: string): Promise<GhUser> {
  const [profileR, reposR, shippingR] = await Promise.all([
    gql<Omit<GhUser, "repositories">>(PROFILE_QUERY, login),
    gql<{ repositories: { totalCount: number; nodes: RepoNode[] } }>(REPOS_QUERY, login),
    gql<{ repositories: { nodes: { name: string; deployments: { totalCount: number }; releases: { totalCount: number } }[] } }>(
      SHIPPING_QUERY,
      login,
    ).catch(() => null),
  ]);
  const profile = check(profileR, login);
  const repos = check(reposR, login).repositories;
  const shipping = new Map(
    (shippingR?.data?.user?.repositories.nodes ?? []).map((n) => [n.name, n] as const),
  );
  return {
    ...profile,
    repositories: {
      totalCount: repos.totalCount,
      nodes: repos.nodes.map((r) => ({
        ...r,
        deployments: shipping.get(r.name)?.deployments ?? { totalCount: 0 },
        releases: shipping.get(r.name)?.releases ?? { totalCount: 0 },
      })),
    },
  };
}

/** Search users via REST. Used to build leaderboards without a database. */
export async function searchUsers(q: string, perPage = 15): Promise<string[]> {
  const url = `${REST_URL}/search/users?q=${encodeURIComponent(q)}&sort=followers&order=desc&per_page=${perPage}`;
  const res = await fetch(url, { headers: headers(), cache: "no-store" });
  if (!res.ok) throw new GitHubError(`GitHub search returned ${res.status}`, res.status);
  const json = (await res.json()) as { items: { login: string; type: string }[] };
  return json.items.filter((i) => i.type === "User").map((i) => i.login);
}

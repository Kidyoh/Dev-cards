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
      "GITHUB_TOKEN is not set. Add a GitHub personal access token to .env.local (see .env.example).",
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

const USER_QUERY = /* GraphQL */ `
  query DevCard($login: String!) {
    user(login: $login) {
      login
      name
      avatarUrl(size: 400)
      location
      createdAt
      followers { totalCount }
      repositoriesContributedTo(
        first: 1
        contributionTypes: [COMMIT, PULL_REQUEST]
        includeUserRepositories: false
      ) { totalCount }
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
      repositories(
        first: 100
        ownerAffiliations: OWNER
        isFork: false
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
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
          languages(first: 8, orderBy: { field: SIZE, direction: DESC }) {
            edges { size node { name color } }
          }
          deployments { totalCount }
          releases { totalCount }
        }
      }
    }
  }
`;

export async function fetchUser(login: string): Promise<GhUser> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ query: USER_QUERY, variables: { login } }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new GitHubError(`GitHub API returned ${res.status}`, res.status);
  }
  const json = (await res.json()) as {
    data?: { user: GhUser | null };
    errors?: { type?: string; message: string }[];
  };
  if (json.errors?.some((e) => e.type === "NOT_FOUND") || (json.data && !json.data.user)) {
    throw new GitHubError(`No GitHub user called "${login}"`, 404);
  }
  if (json.errors?.length) {
    throw new GitHubError(json.errors.map((e) => e.message).join("; "), 502);
  }
  return json.data!.user!;
}

/** Search users via REST. Used to build leaderboards without a database. */
export async function searchUsers(q: string, perPage = 15): Promise<string[]> {
  const url = `${REST_URL}/search/users?q=${encodeURIComponent(q)}&sort=followers&order=desc&per_page=${perPage}`;
  const res = await fetch(url, { headers: headers(), cache: "no-store" });
  if (!res.ok) throw new GitHubError(`GitHub search returned ${res.status}`, res.status);
  const json = (await res.json()) as { items: { login: string; type: string }[] };
  return json.items.filter((i) => i.type === "User").map((i) => i.login);
}

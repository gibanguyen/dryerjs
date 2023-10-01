module.exports = {
    branches: [
        'master',
    ],
    plugins: [
        '@semantic-release/commit-analyzer',
        '@semantic-release/changelog',
        '@semantic-release/npm',
        '@semantic-release/git',
        '@semantic-release/github',
    ],
};

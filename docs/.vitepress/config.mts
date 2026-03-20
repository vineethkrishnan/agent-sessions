import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'claude-sessions',
  description:
    'Interactive session manager for Claude Code — browse, search, delete, and resume past conversations from your terminal.',

  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]],

  ignoreDeadLinks: [/localhost/],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/introduction' },
      { text: 'CLI Reference', link: '/cli-reference' },
      { text: 'Architecture', link: '/architecture' },
      {
        text: 'Links',
        items: [
          { text: 'GitHub', link: 'https://github.com/vineethkrishnan/claude-sessions' },
          { text: 'Changelog', link: 'https://github.com/vineethkrishnan/claude-sessions/releases' },
          { text: 'npm', link: 'https://www.npmjs.com/package/claude-sessions' },
          { text: 'Report an Issue', link: 'https://github.com/vineethkrishnan/claude-sessions/issues/new' },
        ],
      },
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/introduction' },
          { text: 'Installation', link: '/installation' },
          { text: 'Usage', link: '/usage' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'CLI Reference', link: '/cli-reference' },
          { text: 'Keybindings', link: '/keybindings' },
          { text: 'fzf Integration', link: '/fzf-integration' },
        ],
      },
      {
        text: 'Internals',
        items: [
          { text: 'Architecture', link: '/architecture' },
          { text: 'Session Format', link: '/session-format' },
        ],
      },
      {
        text: 'Contributing',
        items: [
          { text: 'Development', link: '/development' },
          { text: 'FAQ', link: '/faq' },
        ],
      },
      {
        text: 'Help',
        items: [
          { text: 'Report an Issue', link: 'https://github.com/vineethkrishnan/claude-sessions/issues/new' },
        ],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/vineethkrishnan/claude-sessions' }],

    search: { provider: 'local' },

    editLink: {
      pattern: 'https://github.com/vineethkrishnan/claude-sessions/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Vineeth N K',
    },

    outline: { level: [2, 3] },
  },
});

/* eslint-disable no-undef */
module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "overrides": [
        {
            // The backend is Node, not a browser, and it had a config of its
            // own extending airbnb-typescript — which pinned a TypeScript
            // plugin that ESLint 8 cannot load, so it was never actually
            // linted. One standard for the repository, and its own five eslint
            // dependencies go away with it.
            "files": ["apps/backend/**/*.ts"],
            "env": { "browser": false, "node": true }
        }
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "plugins": [
        "react",
        "@typescript-eslint"
    ],
    "settings": {
        // Without this, eslint-plugin-react warns on every run that it cannot
        // tell which React it is linting against.
        "react": { "version": "detect" }
    },
    "rules": {
    }
}

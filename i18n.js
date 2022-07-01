module.exports = {
    locales: ['nl', 'fr'], // Array with the languages that you want to use
    defaultLocale: 'nl', // Default language of your website
    pages: {
        '*': ['loc'], // Namespaces that you want to import per page (we stick to one namespace for all the application in this tutorial)
    },
};
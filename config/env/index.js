"use strict";

const devConfig = require('./development');
const productionConfig = require('./production');

const config = (process.env.NODE_ENV === 'production') ? productionConfig : devConfig;

module.exports = config;
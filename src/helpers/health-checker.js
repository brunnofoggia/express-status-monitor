'use strict';

const axios = require('axios');

function allSettled (promises) {
  const wrappedPromises = promises.map(p => Promise.resolve(p)
    .then(
      val => ({ state: 'fulfilled', value: val }),
      err => ({ state: 'rejected', reason: err })
    )
  );

  return Promise.all(wrappedPromises);
}


module.exports = async healthChecks => {
  const checkPromises = [];

  (healthChecks || []).forEach(healthCheck => {
    let uri = `${healthCheck.protocol}://${healthCheck.host}`;

    if (healthCheck.port) {
      uri += `:${healthCheck.port}`;
    }

    uri += healthCheck.path;

    checkPromises.push(axios({
      url: uri,
      method: healthCheck.method || 'GET',
      data: healthCheck.data || null,
      headers: healthCheck.headers || {}
    }));
  });

  const checkResults = [];

  return allSettled(checkPromises).then(results => {
    results.forEach((result, index) => {
        var d = healthChecks[index],
            o = {
            protocol: d.protocol,
            host: d.host,
            link: d.protocol + '://' + d.host + (d.port ? ':'+d.port : '') + d.path,
            alias: d.alias || d.path,
            port: d.port || false,
            path: d.path
        };

        o.status = result.state === 'rejected' ? 'failed' : 'ok';

        checkResults.push(o);
    });

    return checkResults;
  });
};

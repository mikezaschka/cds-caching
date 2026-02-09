function isMissingModuleError(err, packageName) {
  const msg = String(err?.message || '');
  return (
    (err?.code === 'MODULE_NOT_FOUND' || err?.code === 'ERR_MODULE_NOT_FOUND') &&
    (msg.includes(`'${packageName}'`) || msg.includes(`"${packageName}"`) || msg.includes(packageName))
  );
}

function requireOptional(packageName, { feature, value } = {}) {
  try {
    const mod = require(packageName);
    return mod?.default ?? mod;
  } catch (err) {
    if (!isMissingModuleError(err, packageName)) throw err;

    const featureText = feature ? `${feature}="${value}" ` : '';
    throw new Error(`cds-caching: ${featureText}requires installing "${packageName}" (npm i ${packageName})`);
  }
}

function requireAnyOptional(packageNames, { feature, value } = {}) {
  const missing = [];
  for (const packageName of packageNames) {
    try {
      return require(packageName);
    } catch (err) {
      if (isMissingModuleError(err, packageName)) {
        missing.push(packageName);
        continue;
      }
      throw err;
    }
  }

  const featureText = feature ? `${feature}="${value}" ` : '';
  const pkgsQuoted = missing.map((p) => `"${p}"`).join(' or ');
  const pkgsInstall = missing.map((p) => `npm i ${p}`).join(' OR ');
  throw new Error(`cds-caching: ${featureText}requires installing ${pkgsQuoted} (${pkgsInstall})`);
}

module.exports = {
  requireOptional,
  requireAnyOptional
};


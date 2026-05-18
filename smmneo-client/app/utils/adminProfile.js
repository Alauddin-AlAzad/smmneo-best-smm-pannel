export const getAdminDisplayName = (settings) => {
  const general = settings?.general || {};
  const adminEmail = general.adminEmail || settings?.adminEmail || '';
  const siteName = general.siteName || settings?.siteName || settings?.provider?.name || '';

  if (adminEmail) {
    return adminEmail.split('@')[0];
  }

  if (siteName) {
    return siteName;
  }

  return 'Admin User';
};

export const getAdminSubtitle = (settings) => {
  const general = settings?.general || {};
  return general.siteName || settings?.siteName || 'Administrator';
};
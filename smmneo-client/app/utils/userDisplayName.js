export const getDisplayName = (user) => {
  if (!user) return "User";

  const isGoogleLogin = user.providerData?.some(
    (provider) => provider.providerId === "google.com"
  );

  if (isGoogleLogin && user.email) {
    return user.email.split("@")[0];
  }

  if (user.displayName && user.displayName.trim()) {
    return user.displayName.trim();
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return "User";
};
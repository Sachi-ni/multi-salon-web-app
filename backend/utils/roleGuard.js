export const assertNotPrivilegedRole = (role) => {
  if (["super-admin", "manager"].includes(String(role || "").toLowerCase())) {
    const error = new Error("Privileged roles cannot be created through this flow");
    error.statusCode = 400;
    throw error;
  }
};
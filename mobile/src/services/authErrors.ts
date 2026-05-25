type AuthOperation = "login" | "register" | "reset";

export function getFirebaseAuthErrorMessage(
  error: unknown,
  operation: AuthOperation,
): string {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      if (operation === "reset") {
        return "No encontramos una cuenta con ese correo.";
      }
      return "Credenciales invalidas. Verifica correo y contrasena.";
    case "auth/email-already-in-use":
      return "Ese correo ya esta registrado.";
    case "auth/invalid-email":
      return "El correo no tiene un formato valido.";
    case "auth/weak-password":
      return "La contrasena debe tener al menos 6 caracteres.";
    case "auth/network-request-failed":
      return "No se pudo conectar con Firebase. Revisa tu conexion.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera unos minutos antes de volver a intentar.";
    case "auth/missing-email":
      return "Escribe un correo para continuar.";
    default:
      switch (operation) {
        case "register":
          return "No se pudo crear la cuenta en Firebase.";
        case "reset":
          return "No se pudo enviar el enlace de recuperacion.";
        default:
          return "No se pudo iniciar sesion en Firebase.";
      }
  }
}

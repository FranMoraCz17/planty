import { getFirebaseAuthErrorMessage } from "@/src/services/authErrors";

describe("getFirebaseAuthErrorMessage", () => {
  const makeError = (code: string) => ({ code });

  it("devuelve mensaje de credenciales invalidas en login", () => {
    const message = getFirebaseAuthErrorMessage(
      makeError("auth/invalid-credential"),
      "login",
    );
    expect(message).toContain("Credenciales");
  });

  it("devuelve mensaje especifico de cuenta no encontrada en reset", () => {
    const message = getFirebaseAuthErrorMessage(
      makeError("auth/user-not-found"),
      "reset",
    );
    expect(message).toContain("No encontramos una cuenta");
  });

  it("devuelve mensaje de correo ya registrado en register", () => {
    const message = getFirebaseAuthErrorMessage(
      makeError("auth/email-already-in-use"),
      "register",
    );
    expect(message).toContain("ya esta registrado");
  });

  it("devuelve mensaje de formato invalido para auth/invalid-email", () => {
    const message = getFirebaseAuthErrorMessage(
      makeError("auth/invalid-email"),
      "login",
    );
    expect(message).toContain("formato");
  });

  it("devuelve mensaje generico de reset cuando el codigo es desconocido", () => {
    const message = getFirebaseAuthErrorMessage(
      makeError("auth/unknown-code"),
      "reset",
    );
    expect(message).toContain("No se pudo enviar");
  });

  it("devuelve mensaje generico de login cuando no hay codigo", () => {
    const message = getFirebaseAuthErrorMessage(new Error("boom"), "login");
    expect(message).toContain("No se pudo iniciar sesion");
  });
});

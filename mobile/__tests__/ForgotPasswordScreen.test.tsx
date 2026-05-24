import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import ForgotPasswordScreen from "@/src/screens/auth/ForgotPasswordScreen";

const mockedSendPasswordResetEmail = sendPasswordResetEmail as jest.Mock;

describe("ForgotPasswordScreen", () => {
  beforeEach(() => {
    mockedSendPasswordResetEmail.mockReset();
  });

  it("muestra warning si el correo esta vacio", async () => {
    const { getByText, findByText } = render(<ForgotPasswordScreen />);

    await act(async () => {
      fireEvent.press(getByText("Enviar enlace"));
    });

    expect(await findByText("Correo invalido")).toBeTruthy();
    expect(mockedSendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("envia el correo y muestra mensaje de exito cuando Firebase responde OK", async () => {
    mockedSendPasswordResetEmail.mockResolvedValueOnce(undefined);

    const { getByLabelText, getByText, findByText } = render(
      <ForgotPasswordScreen />,
    );

    fireEvent.changeText(getByLabelText("Correo"), "fran@planty.app");

    await act(async () => {
      fireEvent.press(getByText("Enviar enlace"));
    });

    await waitFor(() => {
      expect(mockedSendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        "fran@planty.app",
      );
    });

    expect(await findByText("Correo enviado")).toBeTruthy();
  });

  it("muestra mensaje de error cuando Firebase falla", async () => {
    mockedSendPasswordResetEmail.mockRejectedValueOnce({
      code: "auth/user-not-found",
    });

    const { getByLabelText, getByText, findByText } = render(
      <ForgotPasswordScreen />,
    );

    fireEvent.changeText(getByLabelText("Correo"), "noexiste@planty.app");

    await act(async () => {
      fireEvent.press(getByText("Enviar enlace"));
    });

    expect(await findByText("No se pudo enviar")).toBeTruthy();
  });
});

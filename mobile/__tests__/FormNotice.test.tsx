import { fireEvent, render } from "@testing-library/react-native";
import FormNotice from "@/src/components/forms/FormNotice";

describe("FormNotice", () => {
  it("renderiza el titulo y el mensaje", () => {
    const { getByText } = render(
      <FormNotice
        variant="error"
        title="Error al iniciar"
        message="Credenciales invalidas"
      />,
    );

    expect(getByText("Error al iniciar")).toBeTruthy();
    expect(getByText("Credenciales invalidas")).toBeTruthy();
  });

  it("muestra el boton cerrar cuando se pasa onDismiss y dispara el callback", () => {
    const onDismiss = jest.fn();
    const { getByLabelText } = render(
      <FormNotice
        variant="success"
        title="Listo"
        message="Operacion completada"
        onDismiss={onDismiss}
      />,
    );

    const closeButton = getByLabelText("Cerrar notificacion");
    fireEvent.press(closeButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("no muestra el boton cerrar cuando no se pasa onDismiss", () => {
    const { queryByLabelText } = render(
      <FormNotice
        variant="warning"
        title="Atencion"
        message="Verifica los datos"
      />,
    );

    expect(queryByLabelText("Cerrar notificacion")).toBeNull();
  });
});

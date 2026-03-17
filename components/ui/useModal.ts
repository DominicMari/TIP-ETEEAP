import { useState, useCallback } from "react";

type ModalVariant = "alert" | "confirm" | "success" | "danger";

interface ModalState {
    open: boolean;
    title: string;
    message: string;
    variant: ModalVariant;
    confirmLabel: string;
    cancelLabel: string;
    resolve: ((value: boolean) => void) | null;
}

const defaultState: ModalState = {
    open: false,
    title: "",
    message: "",
    variant: "alert",
    confirmLabel: "OK",
    cancelLabel: "Cancel",
    resolve: null,
};

export function useModal() {
    const [state, setState] = useState<ModalState>(defaultState);

    const showAlert = useCallback(
        (message: string, title = "Notice", variant: ModalVariant = "alert"): Promise<void> => {
            return new Promise((resolve) => {
                setState({
                    open: true,
                    title,
                    message,
                    variant,
                    confirmLabel: "OK",
                    cancelLabel: "Cancel",
                    resolve: () => resolve(),
                });
            });
        },
        []
    );

    const showConfirm = useCallback(
        (
            message: string,
            title = "Confirm",
            variant: ModalVariant = "confirm",
            confirmLabel = "Confirm",
            cancelLabel = "Cancel"
        ): Promise<boolean> => {
            return new Promise((resolve) => {
                setState({
                    open: true,
                    title,
                    message,
                    variant,
                    confirmLabel,
                    cancelLabel,
                    resolve,
                });
            });
        },
        []
    );

    const handleConfirm = useCallback(() => {
        state.resolve?.(true);
        setState(defaultState);
    }, [state]);

    const handleCancel = useCallback(() => {
        state.resolve?.(false);
        setState(defaultState);
    }, [state]);

    return {
        modalProps: {
            open: state.open,
            title: state.title,
            message: state.message,
            variant: state.variant,
            confirmLabel: state.confirmLabel,
            cancelLabel: state.cancelLabel,
            onConfirm: handleConfirm,
            onCancel: state.resolve ? handleCancel : undefined,
        },
        showAlert,
        showConfirm,
    };
}

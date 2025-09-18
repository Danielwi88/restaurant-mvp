import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ModalState = {
  id?: string;
  open: boolean;
  payload?: unknown;
};

export type UIState = {
  modal: ModalState;
};

const initialState: UIState = {
  modal: { id: undefined, open: false, payload: undefined },
};

const slice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openModal: (s, a: PayloadAction<{ id: string; payload?: unknown }>) => {
      s.modal = { id: a.payload.id, open: true, payload: a.payload.payload };
    },
    closeModal: (s) => {
      s.modal.open = false;
      s.modal.id = undefined;
      s.modal.payload = undefined;
    },
    setModalPayload: (s, a: PayloadAction<unknown>) => {
      s.modal.payload = a.payload;
    },
  },
});

export const { openModal, closeModal, setModalPayload } = slice.actions;
export default slice.reducer;


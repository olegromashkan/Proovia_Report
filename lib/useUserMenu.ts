import { create } from 'zustand';

interface UserMenuState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const useUserMenu = create<UserMenuState>(set => ({
  open: false,
  setOpen: (open: boolean) => set({ open })
}));

export default useUserMenu;

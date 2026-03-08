import { create } from 'zustand';

const useRagStore = create((set) => ({
    regulation: null,
    branch: null,
    year: null,
    semester: null,
    contentType: null,

    setRegulation: (val) => set({ regulation: val }),
    setBranch: (val) => set({ branch: val }),
    setYear: (val) => set({ year: val }),
    setSemester: (val) => set({ semester: val }),
    setContentType: (val) => set({ contentType: val }),

    clearAll: () => set({
        regulation: null,
        branch: null,
        year: null,
        semester: null,
        contentType: null,
    }),
}));

export default useRagStore;

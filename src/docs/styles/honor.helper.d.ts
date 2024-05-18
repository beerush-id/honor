
export type MediaQuery = {
  [key: string]: string;
};
declare global {
  interface Window {
    Toqin: {
      getTheme: () => string;
      setTheme: (name: string) => void;
      useQuery: (name: string) => void;
      mediaQueries: MediaQuery[];
    };
  }
}

((queries = [], mode, scheme) => {
    const useQuery = (name) => {
        if (!name.startsWith('@')) {
            name = `@${name}`;
        }
        const { query, group } = queries.find((q) => q.name === name) || {};
        if (query) {
            const elem = document.documentElement;
            const groups = queries.filter((q) => q.group === group);
            for (const g of groups) {
                if (mode === 'class') {
                    elem.classList.remove(g.query);
                }
                else if (mode === 'attribute') {
                    elem.removeAttribute(g.query);
                }
            }
            if (mode === 'class') {
                elem.classList.add(query);
            }
            else if (mode === 'attribute') {
                elem.setAttribute(query, '');
            }
        }
    };
    const applySystemTheme = () => {
        const scheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const query = queries.find((q) => q.scheme === scheme);
        if (query) {
            useQuery(query.name);
        }
    };
    const setTheme = (name) => {
        localStorage.setItem('toqin-color-scheme', name);
        if (name === 'system') {
            applySystemTheme();
        }
        else {
            useQuery(name);
        }
    };
    const getTheme = () => {
        return localStorage.getItem('toqin-color-scheme') || 'system';
    };
    const bootstrap = () => {
        const theme = localStorage.getItem('toqin-color-scheme') || scheme || 'system';
        if (theme === 'system') {
            applySystemTheme();
        }
        else {
            useQuery(theme);
        }
        window.matchMedia('(prefers-color-scheme: dark)')
            .addEventListener('change', () => {
            if (localStorage.getItem('toqin-color-scheme') === 'system') {
                applySystemTheme();
            }
        });
        window.addEventListener('storage', (e) => {
            if (e.key === 'toqin-color-scheme') {
                if (e.newValue === 'system') {
                    applySystemTheme();
                }
                else {
                    useQuery(e.newValue || '');
                }
            }
        });
    };
    if (typeof window !== 'undefined' && !window.Toqin) {
        window.Toqin = { useQuery, getTheme, setTheme, mediaQueries: queries };
        bootstrap();
    }
})([{"name":"@light","group":"color","query":"prefer-light","mediaQuery":"(prefers-color-scheme: light)","scheme":"light"},{"name":"@dark","group":"color","query":"prefer-dark","mediaQuery":"(prefers-color-scheme: dark)","scheme":"dark"}], 'class', 'system');
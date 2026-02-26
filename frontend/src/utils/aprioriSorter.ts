import type { EditorItem } from '../types';

interface Rule {
    antecedent: string;
    consequent: string;
}

export const applyAprioriSorting = (items: EditorItem[], rules: Rule[]) => {
    if (!rules || rules.length === 0) return items;

    const sorted = [...items];

    rules.forEach(rule => {
        const antIdx = sorted.findIndex(p => 
            p.content?.name?.toLowerCase().includes(rule.antecedent.toLowerCase())
        );
        const conIdx = sorted.findIndex(p => 
            p.content?.name?.toLowerCase().includes(rule.consequent.toLowerCase())
        );

        if (antIdx !== -1 && conIdx !== -1 && Math.abs(antIdx - conIdx) !== 1) {
            const [conseq] = sorted.splice(conIdx, 1);
            const newAntIdx = sorted.findIndex(p => 
                p.content?.name?.toLowerCase().includes(rule.antecedent.toLowerCase())
            );
            sorted.splice(newAntIdx + 1, 0, conseq);
        }
    });

    return sorted;
};
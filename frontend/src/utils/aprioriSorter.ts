import type { EditorItem } from "../types";

interface Rule {
    rule_id: number;
    antecedent: string;
    consequent: string;
    support_percent: string;
    confidence_percent: string;
    lift_ratio: string;
    keterangan: string;
}

export const applyAprioriSorting = (items: EditorItem[], rules: Rule[]): EditorItem[] => {
    if (!items || items.length <= 1 || !rules || rules.length === 0) {
        return items;
    }

    const sortedRules = [...rules].sort((a, b) => parseFloat(b.lift_ratio) - parseFloat(a.lift_ratio));

    const unplacedItems = [...items];
    const placedItems: EditorItem[] = [];

    while (unplacedItems.length > 0) {
        const currentItem = unplacedItems.shift();
        if (!currentItem) break;

        placedItems.push(currentItem);

        const currentName = (currentItem.content?.name || "").trim().toUpperCase();

        const matchingRules = sortedRules.filter(r => r.antecedent === currentName);

        for (const rule of matchingRules) {
            const consequentIndex = unplacedItems.findIndex(
                item => (item.content?.name || "").trim().toUpperCase() === rule.consequent
            );

            if (consequentIndex !== -1) {
                const consequentItem = unplacedItems.splice(consequentIndex, 1)[0];
                placedItems.push(consequentItem);
            }
        }
    }

    return placedItems;
};
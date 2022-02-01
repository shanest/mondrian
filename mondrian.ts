/*
Parsing of string rep of constituency parse trees.
Inspired by NLTK:
https://www.nltk.org/_modules/nltk/tree.html
*/

// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
const escapeRegExp = function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

interface Tree {
    label: string;
    children: Array<Tree>;
}

const parseString = function parse_string(string: string, open_bracket: string = "(", close_bracket: string = ")"): Tree {
    // TODO: docstring here
    // TODO: error handling
    // prep reg-ex for tokenizing the linearized parse tree
    const open_br = escapeRegExp(open_bracket);
    const close_br = escapeRegExp(close_bracket);
    const node_pattern = `[^\\s${open_br}${close_br}]+`;
    const leaf_pattern = `[^\\s${open_br}${close_br}]+`;
    const token_re_string = `${open_br}\\s*(${node_pattern})?|${close_br}|${leaf_pattern}`;
    const token_re = new RegExp(token_re_string, "g");
    // tokenize the linearized parse tree
    const matches = string.matchAll(token_re);
    let stack: Array<Tree> = [{ label: "", children: [] }];
    for (const match of matches) {
        // new sub-tree
        if (match[0][0] === open_bracket) {
            stack.push({ label: match[1], children: [] });
        }
        // end sub-tree
        else if (match[0] === close_bracket) {
            const last_tree: Tree | undefined = stack.pop();
            if (last_tree === undefined) {
                console.log("Parsing error")
            } else {
                stack[stack.length - 1].children.push(last_tree);
            }
        }
        // leaf node
        else {
            stack[stack.length - 1].children.push({ label: match[0], children: [] });
        }
    }
    const tree: Tree = stack[stack.length - 1].children[0];
    return tree;
}

const treeToTable = function (tree: Tree, verticalProb: number = 0.5): HTMLTableElement | null {
    // TODO: docstring
    // TODO: style it!!
    // TODO: heights/widths and/or colors somehow derived from length of label??
    // base case: no table for leaf nodes
    if (tree.children.length == 0) {
        return null;
    }
    let table: HTMLTableElement = document.createElement('table');
    table.style.padding = "0";
    table.style.borderCollapse = "collapse";
    const vertical_split: boolean = Math.random() < verticalProb;
    // add parent tr if going to split into td's, else nothing
    let parent_node: HTMLElement;
    if (vertical_split) {
        parent_node = document.createElement('tr');
        table.appendChild(parent_node);
    } else {
        parent_node = table;
    }
    for (const child of tree.children) {
        let child_node: HTMLTableCellElement;
        if (vertical_split) {
            child_node = document.createElement('td');
            parent_node.appendChild(child_node);
        } else {
            let intermediate_node: HTMLElement = document.createElement('tr');
            child_node = document.createElement('td');
            intermediate_node.appendChild(child_node);
            parent_node.appendChild(intermediate_node);
        }
        const child_table = treeToTable(child);
        if (child_table != null) {
            child_node.appendChild(child_table);
            // turn borders off if there will be a nested table
            child_node.style.border = "0";
        }
    }
    return table;
}

window.onload = function () {
    const testString: string = "(S (NP (Det The) (N Teacher)) (VP (V talks) (Adv quickly)))";
    let frame = document.getElementById("frame");
    if (frame != null) {
        const table = treeToTable(parseString(testString));
        if (table != null) {
            frame.appendChild(table);
        }
    }
};
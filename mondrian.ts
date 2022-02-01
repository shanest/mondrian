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
    span_length: number;
}

interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

const addChild = function (tree: Tree, child: Tree) {
    // TODO: docstring
    tree.children.push(child);
    tree.span_length += child.span_length;
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
    let stack: Array<Tree> = [{ label: "", children: [], span_length: 0 }];
    for (const match of matches) {
        // new sub-tree
        if (match[0][0] === open_bracket) {
            stack.push({ label: match[1], children: [], span_length: 0 });
        }
        // end sub-tree
        else if (match[0] === close_bracket) {
            const last_tree: Tree | undefined = stack.pop();
            if (last_tree === undefined) {
                console.log("Parsing error")
            } else {
                addChild(stack[stack.length - 1], last_tree)
            }
        }
        // leaf node
        else {
            const new_tree = { label: match[0], children: [], span_length: match[0].length };
            addChild(stack[stack.length - 1], new_tree)
        }
    }
    const tree: Tree = stack[stack.length - 1].children[0];
    return tree;
}

const numsToPercents = function numsToPercentages(nums: Array<number>): Array<number> {
    let sum = nums.reduce((partialSum, num) => partialSum + num, 0);
    return nums.map((num) => num / sum)
}

const treeToRectangles = function treeToRectangles(tree: Tree, parentRectangle: Rectangle, verticalProb: number = 0.5): Array<Rectangle> {
    // base case
    if (tree.children.length === 0) {
        return [parentRectangle];
    }
    const verticalSplit: boolean = Math.random() < verticalProb;
    const totalSpread = verticalSplit ? parentRectangle.height : parentRectangle.width;
    const percentSplits = numsToPercents(tree.children.map(child => child.span_length));
    // TODO: make sure sum adds to total
    // TODO: add noise here?
    const spans = percentSplits.map(percent => Math.floor(percent * totalSpread))
    console.log(spans);
    let rectangles = [];
    let cur_x = parentRectangle.x;
    let cur_y = parentRectangle.y;
    for (let idx = 0; idx < tree.children.length; idx++) {
        const span = spans[idx];
        if (verticalSplit) {
            rectangles.push(
                // spread list of rectangles as arg to push
                ...treeToRectangles(
                    tree.children[idx],
                    {
                        x: cur_x,
                        y: cur_y,
                        height: span,
                        width: parentRectangle.width
                    }
                )
            );
            cur_y += span;
        } else {
            rectangles.push(
                // spread list of rectangles as arg to push
                ...treeToRectangles(
                    tree.children[idx],
                    {
                        x: cur_x,
                        y: cur_y,
                        height: parentRectangle.height,
                        width: span
                    }
                )
            );
            cur_x += span;
        }
    }
    return rectangles;
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
    const tree = parseString(testString);
    console.log(tree);
    console.log(treeToRectangles(tree, { x: 0, y: 0, width: 500, height: 500 }));
    let frame = document.getElementById("frame");
    if (frame != null) {
        const table = treeToTable(parseString(testString));
        if (table != null) {
            frame.appendChild(table);
        }
    }
};
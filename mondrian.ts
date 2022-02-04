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
    text: string;
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

const sumOfNums = function sumOfNums(nums: Array<number>): number {
    return nums.reduce((partialSum, num) => partialSum + num, 0);
}

const numsToPercents = function numsToPercentages(nums: Array<number>): Array<number> {
    let sum = sumOfNums(nums);
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
    // TODO: add noise here?
    const spans = percentSplits.map(percent => Math.floor(percent * totalSpread))
    // make sure the spans add up to total
    spans[spans.length - 1] += totalSpread - sumOfNums(spans);
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
                        width: parentRectangle.width,
                        text: tree.children[idx].label,
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
                        width: span,
                        text: tree.children[idx].label,
                    }
                )
            );
            cur_x += span;
        }
    }
    return rectangles;
}

const setAttributes = function setAttributes(element: HTMLElement | SVGElement, attributes: { [key: string]: string }) {
    Object.keys(attributes).forEach(key => element.setAttribute(key, attributes[key]));
}

const randomChoice = function randomChoice<Type>(arr: Array<Type>): Type {
    const index = Math.floor(Math.random() * arr.length);
    return arr[index];
}

const drawMontreean = function () {
    const theString: string = (<HTMLInputElement>document.getElementById("parse-input")).value;
    const tree = parseString(theString);
    const colors: Array<string> = (<HTMLInputElement>document.getElementById("colorList")).value.split(",");
    const colorProb: number = parseFloat((<HTMLInputElement>document.getElementById("cellColor")).value);
    const verticalSplitProb: number = parseFloat((<HTMLInputElement>document.getElementById("verticalSplit")).value);

    let frame = document.getElementById("frame");
    // clear out any previous
    frame.innerHTML = "";

    if (frame != null) {
        const width: number = frame.clientWidth;
        const height: number = width;
        const rectangles: Array<Rectangle> = treeToRectangles(tree, { x: 0, y: 0, width: width, height: height, text: "" }, verticalSplitProb);
        let svg: SVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        setAttributes(
            svg,
            {
                "viewBox": `0 0 ${width} ${height}`,
                "height": height.toString(),
                "width": width.toString()
            }
        );
        frame.appendChild(svg);
        for (const rect of rectangles) {
            let svg_rect: SVGElement = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            setAttributes(
                svg_rect,
                {
                    "x": rect.x.toString(),
                    "y": rect.y.toString(),
                    "width": rect.width.toString(),
                    "height": rect.height.toString(),
                }
            );
            svg_rect.setAttribute(
                "fill",
                Math.random() < colorProb ? randomChoice<string>(colors) : 'white'
            );
            svg_rect.style.stroke = "black";
            svg_rect.style.strokeWidth = "3px";
            svg.appendChild(svg_rect);
            // add text to rectangle
            // TODO: rotate text vertically if "vertical" rectangle
            // TODO: dynamically set text size as well?
            let rect_text: SVGElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
            rect_text.textContent = rect.text;
            svg.appendChild(rect_text);
            // helpers for putting text in center of rectangle
            let textBox = rect_text.getClientRects()[0];
            const rectCenter = {
                x: Math.floor(rect.x + rect.width / 2),
                y: Math.floor(rect.y + rect.height / 2),
            }
            setAttributes(
                rect_text,
                {
                    "x": (rectCenter.x - textBox.width / 2).toString(),
                    "y": (rectCenter.y + textBox.height / 2).toString(),
                }
            )
        }
        // outer border hack...
        // TODO: more elegant?
        let outer_rect: SVGElement = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        outer_rect.style.stroke = 'black';
        outer_rect.style.strokeWidth = '6px';
        setAttributes(
            outer_rect,
            {
                "x": "0",
                "y": "0",
                "width": width.toString(),
                "height": height.toString(),
                "fill": "none"
            }
        );
        svg.appendChild(outer_rect);
        // set text visibility
        setTextVisibility();
    }

};

/**
 * Toggle visibility of text overlay on cells, based on checkbox.
 */
const setTextVisibility = function () {
    const showText: boolean = (<HTMLInputElement>document.getElementById("showText")).checked;
    const visibility = showText ? "visible" : "hidden";
    let textElements = document.getElementsByTagName("text");
    for (let elt of textElements) {
        elt.style.visibility = visibility;
    }
};

window.onload = drawMontreean;
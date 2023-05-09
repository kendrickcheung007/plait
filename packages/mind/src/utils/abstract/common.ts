import { AbstractNode, isStandardLayout } from '@plait/layouts';
import { MindElement } from '../../interfaces/element';
import { Path, PlaitBoard, PlaitElement, Transforms } from '@plait/core';
import { MindNodeComponent } from '../../node.component';
import { createMindElement, divideElementByParent, filterChildElement } from '../mindmap';
import { GRAY_COLOR } from '../../constants';
import { MindmapQueries } from '../../queries';

export const separateChildren = (parentElement: MindElement) => {
    const rightNodeCount = parentElement.rightNodeCount!;
    const children = parentElement.children;
    let rightChildren = [],
        leftChildren = [];

    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (AbstractNode.isAbstract(child) && child.end < rightNodeCount) {
            rightChildren.push(child);
            continue;
        }
        if (AbstractNode.isAbstract(child) && child.start >= rightNodeCount) {
            leftChildren.push(child);
            continue;
        }

        if (i < rightNodeCount) {
            rightChildren.push(child);
        } else {
            leftChildren.push(child);
        }
    }

    return { leftChildren, rightChildren };
};

export const isSetAbstract = (element: PlaitElement) => {
    const component = PlaitElement.getComponent(element) as MindNodeComponent;
    const parent = component.parent;

    if (!parent) return false;

    const elementIndex = parent.children.indexOf(component.node);

    return parent.children.some(child => {
        return AbstractNode.isAbstract(child.origin) && elementIndex >= child.origin.start! && elementIndex <= child.origin.end!;
    });
};

export const canSetAbstract = (element: PlaitElement) => {
    return !PlaitElement.isRootElement(element) && !AbstractNode.isAbstract(element) && !isSetAbstract(element);
};

export const setAbstract = (board: PlaitBoard, elements: PlaitElement[]) => {
    let elementGroup = filterChildElement(elements as MindElement[]);
    const { parentElements, abstractIncludedGroups } = divideElementByParent(elementGroup);

    abstractIncludedGroups.forEach((group, index) => {
        const groupParent = parentElements[index];
        setAbstractByElements(board, groupParent, group);
    });
};

export const setAbstractByElements = (board: PlaitBoard, groupParent: MindElement, group: MindElement[]) => {
    const indexArray = group.map(child => groupParent!.children.indexOf(child)).sort((a, b) => a - b);
    const rightNodeCount = groupParent?.rightNodeCount;
    const start = indexArray[0],
        end = indexArray[indexArray.length - 1];

    if (
        isStandardLayout(MindmapQueries.getLayoutByElement(groupParent)) &&
        rightNodeCount &&
        start < rightNodeCount &&
        end >= rightNodeCount
    ) {
        const childrenLength = groupParent.children.length;
        const path = [...PlaitBoard.findPath(board, groupParent), childrenLength];
        const leftChildren = indexArray.filter(index => index >= rightNodeCount);
        const rightCHildren = indexArray.filter(index => index < rightNodeCount);

        insetAbstractNode(board, path, rightCHildren[0], rightCHildren[rightCHildren.length - 1]);
        insetAbstractNode(board, Path.next(path), leftChildren[0], leftChildren[leftChildren.length - 1]);
    } else {
        const path = [...PlaitBoard.findPath(board, groupParent), groupParent.children.length];

        insetAbstractNode(board, path, start, end);
    }
};

export const insetAbstractNode = (board: PlaitBoard, path: Path, start: number, end: number) => {
    const mindElement = createMindElement('概要', 28, 20, {
        strokeColor: GRAY_COLOR,
        linkLineColor: GRAY_COLOR
    });

    mindElement.start = start;
    mindElement.end = end;

    Transforms.insertNode(board, mindElement, path);
};

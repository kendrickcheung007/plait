import { PlaitBoard, PlaitElement, setTransformRotate } from '@plait/core';

export interface GeneratorExtraData {}

export interface GeneratorOptions {
    prepend?: boolean;
}

export abstract class Generator<
    T extends PlaitElement = PlaitElement,
    K extends GeneratorExtraData = GeneratorExtraData,
    V extends GeneratorOptions = GeneratorOptions
> {
    g?: SVGGElement;

    protected options?: V;

    constructor(protected board: PlaitBoard, options?: V) {
        this.options = options;
    }

    processDrawing(element: T, parentG: SVGGElement, data?: K) {
        if (this.canDraw && this.canDraw(element, data)) {
            const g = this.draw(element, data);
            if (g) {
                if (this.g && parentG.contains(this.g)) {
                    this.g.replaceWith(g);
                } else {
                    if (this.options?.prepend) {
                        parentG.prepend(g);
                    } else {
                        parentG.appendChild(g);
                    }
                }
                this.g = g;
                const rect = this.board.getRectangle(element);
                if (rect && element.angle) {
                    setTransformRotate(g, rect, element.angle);
                }
            } else {
                this.destroy();
            }
            if (hasAfterDraw(this)) {
                this.afterDraw(element);
            }
        } else {
            this.destroy();
        }
    }

    /**
     * abstract function
     */
    protected abstract canDraw(element: T, data?: K): boolean;

    /**
     * abstract function
     */
    protected abstract draw(element: T, data?: K): SVGGElement | undefined;

    destroy() {
        if (this.g) {
            this.g.remove();
            this.g = undefined;
        }
    }
}

export interface AfterDraw<T extends PlaitElement = PlaitElement> {
    afterDraw(element: T): void;
}

export function hasAfterDraw(value: any): value is AfterDraw {
    if (value.afterDraw) {
        return true;
    }
    return false;
}

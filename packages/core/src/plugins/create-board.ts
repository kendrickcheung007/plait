import { PlaitBoard, PlaitBoardOptions } from '../interfaces/board';
import { PlaitPointerType } from '../interfaces/pointer';
import { PlaitElement } from '../interfaces/element';
import { PlaitPluginElementContext } from '../core/element/context';
import { PlaitOperation } from '../interfaces/operation';
import { Transforms } from '../transforms';
import { FLUSHING, PATH_REFS } from '../utils/weak-maps';
import { PathRef, PathRefOptions } from '../interfaces/path-ref';
import { Path } from '../interfaces/path';
import { ThemeColorMode } from '../interfaces/theme';
import { CoreTransforms } from '../transforms/element';
import { WritableClipboardContext, setClipboardData } from '../utils';

export function createBoard(children: PlaitElement[], options?: PlaitBoardOptions): PlaitBoard {
    const board: PlaitBoard = {
        viewport: {
            zoom: 1
        },
        children,
        theme: { themeColorMode: ThemeColorMode.default },
        operations: [],
        history: {
            redos: [],
            undos: []
        },
        selection: null,
        options: options || {
            readonly: false,
            hideScrollbar: false,
            disabledScrollOnNonFocus: false
        },
        pointer: options?.readonly ? PlaitPointerType.hand : PlaitPointerType.selection,
        undo: () => {},
        redo: () => {},
        apply: (operation: PlaitOperation) => {
            for (const ref of board.pathRefs()) {
                PathRef.transform(ref, operation);
            }

            board.operations.push(operation);

            Transforms.transform(board, operation);

            if (!FLUSHING.get(board)) {
                FLUSHING.set(board, true);

                Promise.resolve().then(() => {
                    FLUSHING.set(board, false);
                    board.onChange();
                    board.afterChange();
                    board.operations = [];
                });
            }
        },
        pathRef: (path: Path, options?: PathRefOptions) => {
            const affinity = options?.affinity || 'forward';
            const ref: PathRef = {
                current: path,
                affinity,
                unref() {
                    const { current } = ref;
                    const pathRefs = board.pathRefs();
                    pathRefs.delete(ref);
                    ref.current = null;
                    return current;
                }
            };

            const refs = board.pathRefs();
            refs.add(ref);
            return ref;
        },
        pathRefs: () => {
            let refs = PATH_REFS.get(board);

            if (!refs) {
                refs = new Set();
                PATH_REFS.set(board, refs);
            }

            return refs;
        },
        onChange: () => {},
        afterChange: () => {},
        mousedown: (event: MouseEvent) => {},
        mousemove: (event: MouseEvent) => {},
        mouseleave: (event: MouseEvent) => {},
        globalMousemove: (event: MouseEvent) => {},
        mouseup: (event: MouseEvent) => {},
        globalMouseup: (event: MouseEvent) => {},
        keyDown: (event: KeyboardEvent) => {},
        globalKeyDown: (event: KeyboardEvent) => {},
        keyUp: (event: KeyboardEvent) => {},
        dblClick: (event: MouseEvent) => {},
        setFragment: (data: DataTransfer | null, clipboardContext: WritableClipboardContext | null) => {
            setClipboardData(data, clipboardContext);
        },
        insertFragment: (data: DataTransfer | null) => {},
        deleteFragment: (data: DataTransfer | null) => {
            const elements = board.getDeletedFragment([]);
            CoreTransforms.removeElements(board, elements);
        },
        getDeletedFragment: (data: PlaitElement[]) => data,
        getRelatedFragment: (data: PlaitElement[]) => data,
        drawElement: (context: PlaitPluginElementContext) => [],
        redrawElement: (context: PlaitPluginElementContext, previousContext) => {},
        destroyElement: (context: PlaitPluginElementContext) => {},
        isWithinSelection: element => false,
        isRectangleHit: element => false,
        isHit: element => false,
        isInsidePoint: element => false,
        isRecursion: element => true,
        isMovable: element => false,
        getRectangle: element => null,
        applyTheme: (element: PlaitElement) => {},
        isAlign: element => false,
        pointerDown: pointer => {},
        pointerMove: pointer => {},
        pointerUp: pointer => {},
        pointerCancel: pointer => {},
        pointerOut: pointer => {},
        pointerLeave: pointer => {},
        globalPointerMove: pointer => {},
        globalPointerUp: pointer => {},
        isImageBindingAllowed: (element: PlaitElement) => false
    };
    return board;
}

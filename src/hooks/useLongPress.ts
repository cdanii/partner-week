import { useCallback, useRef, useState } from 'react';

interface Options {
    shouldPreventDefault?: boolean;
    delay?: number;
}

export default function useLongPress(
    onLongPress: (event: React.MouseEvent | React.TouchEvent) => void,
    onClick: () => void,
    { shouldPreventDefault = true, delay = 700 }: Options = {}
) {
    const [longPressTriggered, setLongPressTriggered] = useState(false);
    const timeout = useRef<NodeJS.Timeout | null>(null);
    const target = useRef<EventTarget | null>(null);
    const startPos = useRef<{ x: number; y: number } | null>(null);

    const start = useCallback(
        (event: React.MouseEvent | React.TouchEvent) => {
            if ('touches' in event) {
                startPos.current = {
                    x: event.touches[0].clientX,
                    y: event.touches[0].clientY,
                };
            }
            if (shouldPreventDefault && event.target) {
                target.current = event.target;
            }
            timeout.current = setTimeout(() => {
                onLongPress(event);
                setLongPressTriggered(true);
            }, delay);
        },
        [onLongPress, delay, shouldPreventDefault]
    );

    const clear = useCallback(
        (event: React.MouseEvent | React.TouchEvent, shouldTriggerClick = true) => {
            if (timeout.current) {
                clearTimeout(timeout.current);
            }
            if (shouldTriggerClick && !longPressTriggered) {
                onClick();
            }
            setLongPressTriggered(false);
            target.current = null;
            startPos.current = null;
        },
        [onClick, longPressTriggered]
    );

    const move = useCallback((event: React.TouchEvent) => {
        if (startPos.current && timeout.current) {
            const moveX = Math.abs(event.touches[0].clientX - startPos.current.x);
            const moveY = Math.abs(event.touches[0].clientY - startPos.current.y);

            // Cancel if moved more than 10px
            if (moveX > 10 || moveY > 10) {
                if (timeout.current) clearTimeout(timeout.current);
                timeout.current = null;
                startPos.current = null;
            }
        }
    }, []);

    return {
        onMouseDown: (e: React.MouseEvent) => start(e),
        onTouchStart: (e: React.TouchEvent) => start(e),
        onMouseUp: (e: React.MouseEvent) => clear(e),
        onMouseLeave: (e: React.MouseEvent) => clear(e, false),
        onTouchEnd: (e: React.TouchEvent) => clear(e),
        onTouchMove: (e: React.TouchEvent) => move(e),
    };
}

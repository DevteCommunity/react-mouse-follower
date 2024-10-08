import { jsx, jsxs } from 'react/jsx-runtime';
import { create } from 'zustand';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// import { create } from 'zustand';
const log = (config) => (set, get, api) => config((args) => {
    const prev = get();
    if (prev.logging) {
        console.log('  applying', args);
        set(args);
        console.log('  new state', get());
    }
    else {
        set(args);
    }
}, get, api);
const useMouseStore = create(log((set) => ({
    curSettings: {},
    layers: [],
    logging: false,
    pushLayer: (newLayer) => set((state) => {
        const newCur = Object.assign(Object.assign({}, state.curSettings), newLayer);
        state.layers.push(newCur);
        return { layers: state.layers, curSettings: newCur };
    }),
    popLayer: () => set((state) => {
        if (state.layers.length > 1) {
            state.layers.pop();
            return { layers: state.layers, curSettings: state.layers.at(state.layers.length - 1) };
        }
        else {
            return { layers: [], curSettings: {} };
        }
    }),
    clearLayers: () => set((state) => {
        return { layers: [], curSettings: {} };
    }),
    log: () => set((state) => {
        return { logging: !state.logging };
    }),
})));

function UpdateFollower({ mouseOptions, style, className, onMouseEnter, onMouseLeave, onClick, children, }) {
    const { addLayer, removeLayer } = useMouseStore((state) => ({ addLayer: state.pushLayer, removeLayer: state.popLayer }));
    function handleMouseEnter() {
        addLayer(mouseOptions);
        if (onMouseEnter) {
            onMouseEnter();
        }
    }
    function handleMouseLeave() {
        removeLayer();
        if (onMouseLeave != null) {
            onMouseLeave();
        }
    }
    return (jsx("div", { style: style, className: className, onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, onClick: onClick, children: children }));
}

function FollowerDiv({ pos, options }) {
    const calculatePosition = () => {
        if (options.customLocation != null) {
            return { x: options.customLocation.x, y: options.customLocation.y };
        }
        else if (options.customPosition != null) {
            const rect = options.customPosition.current.getBoundingClientRect();
            const radius = options.radius ? options.radius : 12 / 2;
            const x = rect.left + rect.width / 2 - radius;
            const y = rect.top + rect.height / 2 - radius;
            return { x, y };
        }
        else {
            return { x: pos.x, y: pos.y };
        }
    };
    return (jsx(motion.div, { initial: {
            x: pos.x,
            y: pos.y,
            scale: 1,
            backgroundColor: options.backgroundColor || '#f9f9f9',
            zIndex: options.zIndex || -5,
            mixBlendMode: options.mixBlendMode || 'initial',
        }, animate: {
            x: calculatePosition().x,
            y: calculatePosition().y,
            scale: options.scale != null ? options.scale : 1,
            rotate: options.rotate || 0,
            backgroundColor: options.backgroundColor || '#f9f9f9',
            zIndex: options.zIndex || -5,
            mixBlendMode: options.mixBlendMode || 'initial',
        }, style: {
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: 'min-content',
            height: 'min-content',
            borderRadius: '9999px',
            overflow: 'hidden',
        }, transition: { type: 'tween', duration: options.followSpeed ? 0.3 / options.followSpeed : 0.3, ease: 'circOut' }, id: "mouse-follower", children: jsx("div", { style: {
                width: `${options.radius ? options.radius * 2 : 12}px`,
                height: `${options.radius ? options.radius * 2 : 12}px`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'transparent',
            }, children: jsxs("div", { style: {
                    width: '100%',
                    height: '100%',
                    borderRadius: '9999px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                }, children: [options.text && !options.backgroundElement ? (jsx(motion.p, { initial: { opacity: 0.7 }, animate: { opacity: 1 }, transition: { type: 'tween', duration: options.followSpeed ? 0.3 / options.followSpeed : 0.3, ease: 'circOut' }, style: {
                            width: '85%',
                            textAlign: 'center',
                            lineHeight: options.textLineHeight,
                            letterSpacing: options.textLetterSpacing,
                            fontFamily: options.textFontFamily,
                            fontSize: options.textFontSize ? options.textFontSize : '12px',
                            color: options.textColor ? options.textColor : 'white',
                        }, children: options.text })) : null, jsx(AnimatePresence, { mode: "wait", children: options.backgroundElement ? (jsx(motion.div, { style: {
                                width: '100%',
                                height: '100%',
                                borderRadius: '9999px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                overflow: 'hidden',
                            }, animate: { opacity: 1 }, exit: { opacity: 0.3 }, transition: { type: 'tween', duration: options.followSpeed ? 0.3 / options.followSpeed : 0.3, ease: 'circOut' }, children: options.backgroundElement })) : null })] }) }) }));
}

const defaultRadius = 12 / 2;
function FollowerInitialiserComponent() {
    const [isHovering, setIsHovering] = useState(true);
    const options = useMouseStore((store) => store.curSettings);
    useEffect(() => {
        const handleMouseLeave = () => {
            setIsHovering(false);
        };
        const handleMouseEnter = () => {
            setIsHovering(true);
        };
        const body = document.querySelector('body');
        body.addEventListener('mouseleave', handleMouseLeave);
        body.addEventListener('mouseenter', handleMouseEnter);
        return () => {
            body.removeEventListener('mouseleave', handleMouseLeave);
            body.removeEventListener('mouseenter', handleMouseEnter);
        };
    }, []);
    return (jsx(ManagePosition, { options: !isHovering ? Object.assign(Object.assign({}, options), { scale: 0, customLocation: null, customPosition: null }) : options }));
}
function ManagePosition({ options }) {
    const [pos, setPos] = useState({
        x: -20,
        y: -20,
    });
    useEffect(() => {
        const mouseMove = (event) => {
            if (options.radius != null) {
                setPos({
                    x: event.clientX - options.radius,
                    y: event.clientY - options.radius,
                });
            }
            else {
                setPos({
                    x: event.clientX - defaultRadius,
                    y: event.clientY - defaultRadius,
                });
            }
        };
        window.addEventListener('mousemove', mouseMove);
        return () => {
            window.removeEventListener('mousemove', mouseMove);
        };
    }, [options === null || options === void 0 ? void 0 : options.radius]);
    return (jsx(AnimatePresence, { mode: "wait", children: options.visible !== false ? jsx(FollowerDiv, { options: options, pos: pos }) : null }));
}

function MouseFollower() {
    return jsx(FollowerInitialiserComponent, {});
}

function useControlOptions() {
    const store = useMouseStore((state) => ({
        topLayer: state.layers[state.layers.length > 0 ? state.layers.length - 1 : null],
        addOptionLayer: state.pushLayer,
        removePreviousLayer: state.popLayer,
        clearLayers: state.clearLayers,
        log: state.log,
    }));
    return Object.assign({}, store);
}

export { MouseFollower, UpdateFollower, useControlOptions };

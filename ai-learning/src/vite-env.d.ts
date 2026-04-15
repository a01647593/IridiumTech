/// <reference types="vite/client" />

export {};

declare module 'react' {
	export type SetStateAction<S> = S | ((prevState: S) => S);
	export type Dispatch<A> = (value: A) => void;

	export interface FormEvent<T = Element> {
		preventDefault(): void;
		currentTarget: T;
		target: EventTarget & T;
	}

	export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
}

declare module 'react/jsx-runtime' {
	export const Fragment: any;
	export function jsx(type: any, props: any, key?: any): any;
	export function jsxs(type: any, props: any, key?: any): any;
}

declare global {
	namespace JSX {
		interface IntrinsicElements {
			[elementName: string]: any;
		}
	}
}
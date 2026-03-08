declare module '@xterm/headless' {
  export interface IBufferCell {
    getChars(): string;
    getFgColor(): number;
    getBgColor(): number;
    isFgRGB(): boolean;
    isBgRGB(): boolean;
    isBold(): boolean | number;
    isDim(): boolean | number;
    isItalic(): boolean | number;
    isUnderline(): boolean | number;
  }
  export interface IBufferLine {
    getCell(x: number): IBufferCell | undefined;
    length: number;
  }
  export interface IBuffer {
    getLine(y: number): IBufferLine | undefined;
    length: number;
  }
  export class Terminal {
    constructor(options?: { cols?: number; rows?: number; allowProposedApi?: boolean });
    write(data: string, callback?: () => void): void;
    readonly buffer: { normal: IBuffer };
  }
}

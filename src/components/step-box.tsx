import {
    BoxRenderable,
    OptimizedBuffer,
    RGBA,
    type BoxOptions,
    type RenderContext,
} from '@opentui/core';
import { extend } from '@opentui/react';

// Custom renderable that extends BoxRenderable
class ConsoleButtonRenderable extends BoxRenderable {
    private _label: string = 'Button';
    private _labelColor: string = '#ffffff';
    private _icon: string = '▪';
    private _iconColor: string = '#ffffff';
    private _isLast: boolean = false;
    constructor(
        ctx: RenderContext,
        options: BoxOptions & {
            label?: string;
            isLast?: boolean;
            labelColor?: string;
            icon?: string;
            iconColor?: string;
        }
    ) {
        super(ctx, {
            ...options,
            border: false,
            shouldFill: false,
        });

        if (options.label) {
            this._label = options.label;
        }

        if (options.isLast) {
            this._isLast = options.isLast;
        }

        if (options.labelColor) {
            this._labelColor = options.labelColor;
        }

        if (options.icon) {
            this._icon = options.icon;
        }

        if (options.iconColor) {
            this._iconColor = options.iconColor;
        }
    }

    public override renderSelf(buffer: OptimizedBuffer): void {
        const topOffset = 0;

        this.drawBackground(buffer);
        this.drawCustomBorder(buffer, topOffset);
        // this.drawLabel(buffer, topOffset);
    }

    private drawBackground(buffer: OptimizedBuffer) {
        const color = this.backgroundColor;

        for (let row = 0; row < this.height; row++) {
            buffer.drawText(' '.repeat(this.width), this.x, this.y + row, color);
        }
    }

    private drawCustomBorder(buffer: OptimizedBuffer, topOffset: number) {
        const x = this.x;
        const y = this.y;
        const h = this.height;

        // top border (shifted)
        buffer.drawText(this._icon, x, y + topOffset, RGBA.fromHex(this._iconColor));

        // left border (starts lower)
        for (let i = topOffset + 1; i < h - 1; i++) {
            buffer.drawText('│', x, y + i, RGBA.fromHex(this._labelColor));
        }

        // bottom left corner shifted
        buffer.drawText(this._isLast ? '└' : '│', x, y + h - 1, RGBA.fromHex(this._labelColor));
    }

    get label(): string {
        return this._label;
    }

    set label(value: string) {
        this._label = value;
        this.requestRender();
    }

    get isLast(): boolean {
        return this._isLast;
    }

    set isLast(value: boolean) {
        if (this._isLast !== value) {
            this._isLast = value;
            this.requestRender();
        }
    }

    get labelColor(): string {
        return this._labelColor;
    }

    set labelColor(value: string) {
        if (this._labelColor !== value) {
            this._labelColor = value;
            this.requestRender();
        }
    }

    get icon(): string {
        return this._icon;
    }

    set icon(value: string) {
        if (this._icon !== value) {
            this._icon = value;
            this.requestRender();
        }
    }

    get iconColor(): string {
        return this._iconColor;
    }

    set iconColor(value: string) {
        if (this._iconColor !== value) {
            this._iconColor = value;
            this.requestRender();
        }
    }
}

// TypeScript module augmentation for proper typing
declare module '@opentui/react' {
    interface OpenTUIComponents {
        consoleButton: typeof ConsoleButtonRenderable;
    }
}

// Extend the component catalogue
export function registerConsoleButton() {
    extend({
        consoleButton: ConsoleButtonRenderable,
    });
}

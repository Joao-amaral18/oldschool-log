import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
    ArrowUp,
    ArrowDown,
    Copy,
    Trash2,
    MoreVertical,
} from "lucide-react"
import { useMediaQuery } from "@/hooks/useMediaQuery"

interface ExerciseActionsProps {
    onMoveUp: () => void
    onMoveDown: () => void
    onDuplicate: () => void
    onDelete: () => void
    canMoveUp: boolean
    canMoveDown: boolean
}

export function ExerciseActions({
    onMoveUp,
    onMoveDown,
    onDuplicate,
    onDelete,
    canMoveUp,
    canMoveDown,
}: ExerciseActionsProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)")

    const actions = [
        {
            label: "Mover para cima",
            icon: ArrowUp,
            onClick: onMoveUp,
            disabled: !canMoveUp,
        },
        {
            label: "Mover para baixo",
            icon: ArrowDown,
            onClick: onMoveDown,
            disabled: !canMoveDown,
        },
        {
            label: "Duplicar última série",
            icon: Copy,
            onClick: onDuplicate,
            disabled: false,
        },
        {
            label: "Excluir exercício",
            icon: Trash2,
            onClick: onDelete,
            disabled: false,
            isDestructive: true,
        },
    ]

    if (isDesktop) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                        <span className="sr-only">Ações do exercício</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        onClick={onMoveUp}
                        disabled={!canMoveUp}
                    >
                        <ArrowUp className="mr-2 h-4 w-4" /> Mover para cima
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={onMoveDown}
                        disabled={!canMoveDown}
                    >
                        <ArrowDown className="mr-2 h-4 w-4" /> Mover para baixo
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDuplicate}>
                        <Copy className="mr-2 h-4 w-4" /> Duplicar série
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={onDelete}
                        className="text-destructive"
                    >
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                    <span className="sr-only">Ações do exercício</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom">
                <SheetHeader>
                    <SheetTitle>Ações do Exercício</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-2">
                    {actions.map((action, index) => (
                        <Button
                            key={index}
                            variant={
                                action.isDestructive ? "destructive" : "outline"
                            }
                            className="w-full justify-start text-base py-6"
                            onClick={action.onClick}
                            disabled={action.disabled}
                        >
                            <action.icon className="mr-3 h-5 w-5" />
                            {action.label}
                        </Button>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    )
}

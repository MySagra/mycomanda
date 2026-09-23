"use client"

import { useState, type ReactNode } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useDeviceType } from "@/hooks/use-device-type"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "cn"
import {
    AutoCompleteIllustration,
    CompletedIllustration,
    DishProgressIllustration,
    HoverActionsIllustration,
    PinnedIllustration,
    PrintersIllustration,
    ReorderIllustration,
    TapActionsIllustration,
} from "./GuideIllustrations"

interface Step {
    title: string
    text: string
    image: ReactNode
}

// Desktop and tablet share the steps; only the gestures differ.
function buildSteps(touch: boolean): Step[] {
    return [
        {
            title: "Segna i piatti pronti",
            text: touch
                ? "Tocca un piatto per segnare una porzione come pronta. Se la quantità è più di 1, tocca una volta per ogni porzione: la riga si riempie fino a diventare verde."
                : "Clicca su un piatto per segnare una porzione come pronta. Se la quantità è più di 1, clicca una volta per ogni porzione: la riga si riempie fino a diventare verde.",
            image: <DishProgressIllustration touch={touch} />,
        },
        {
            title: "Completamento automatico",
            text: touch
                ? "Quando tutti i piatti di una card sono pronti, il bordo diventa verde e si svuota in 5 secondi: allo scadere l'ordine si completa da solo. Hai sbagliato? Tocca di nuovo un piatto prima che il bordo si svuoti."
                : "Quando tutti i piatti di una card sono pronti, il bordo diventa verde e si svuota in 5 secondi: allo scadere l'ordine si completa da solo. Hai sbagliato? Clicca di nuovo un piatto prima che il bordo si svuoti.",
            image: <AutoCompleteIllustration />,
        },
        touch
            ? {
                  title: "Fissa o completa un ordine",
                  text: "Tocca una card fuori dai piatti: si aprono i pulsanti Fissa, Completa e Annulla. Completa chiude l'ordine e lo toglie dal monitor.",
                  image: <TapActionsIllustration />,
              }
            : {
                  title: "Fissa o completa un ordine",
                  text: "Passa il mouse sopra una card: in alto a destra compaiono due pulsanti. La puntina fissa l'ordine in cima, la spunta verde lo completa e lo toglie dal monitor.",
                  image: <HoverActionsIllustration />,
              },
        {
            title: "Riordina le card",
            text: touch
                ? "Tieni premuta una card finché le card iniziano a tremare, poi trascinala dove vuoi. Quando hai finito tocca Fine."
                : "Tieni premuto il tasto del mouse su una card e trascinala dove vuoi. Le altre card si spostano per farle posto.",
            image: <ReorderIllustration touch={touch} />,
        },
        {
            title: "Ordini fissati",
            text: "Gli ordini fissati stanno in cima, sopra la linea gialla, con il bordo evidenziato. Gli altri seguono dal più vecchio al più recente.",
            image: <PinnedIllustration />,
        },
        {
            title: "Ordini completati",
            text: "Con il pulsante Completati in alto vedi gli ordini chiusi oggi. Se ne hai chiuso uno per sbaglio, premi Riporta in lavorazione.",
            image: <CompletedIllustration />,
        },
        {
            title: "Stampanti e dispositivo",
            text: "Il monitor mostra solo le comande delle stampanti scelte: cambiale con Cambia in alto. In Impostazioni scegli se usi un computer o un tablet.",
            image: <PrintersIllustration />,
        },
    ]
}

interface Props {
    open: boolean
    onClose: () => void
}

export function UsageGuide({ open, onClose }: Props) {
    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="sm:max-w-md">
                {/* The popup unmounts on close, so every open starts from the first step. */}
                <GuideBody onClose={onClose} />
            </DialogContent>
        </Dialog>
    )
}

function GuideBody({ onClose }: { onClose: () => void }) {
    const { deviceType } = useDeviceType()
    const touch = deviceType === "tablet"
    const steps = buildSteps(touch)
    const [index, setIndex] = useState(0)
    const step = steps[index]
    const last = index === steps.length - 1

    return (
        <>
            <DialogHeader>
                <span className="text-xs font-medium text-muted-foreground">
                    Guida · {index + 1} di {steps.length}
                </span>
                <DialogTitle className={cn("text-lg", touch && "text-xl")}>{step.title}</DialogTitle>
            </DialogHeader>

            {/* Keyed so each step's animation starts from the beginning. */}
            <div key={index} className="animate-in fade-in-0 duration-200">
                {step.image}
            </div>

            <DialogDescription className={cn("min-h-16 text-foreground/90", touch && "text-base")}>
                {step.text}
            </DialogDescription>

            <div className="flex justify-center gap-1.5">
                {steps.map((s, i) => (
                    <button
                        key={s.title}
                        type="button"
                        aria-label={`Vai al passo ${i + 1}`}
                        onClick={() => setIndex(i)}
                        className={cn(
                            "h-2 cursor-pointer rounded-full transition-all",
                            i === index ? "w-5 bg-primary" : "w-2 bg-muted-foreground/30",
                        )}
                    />
                ))}
            </div>

            <DialogFooter>
                <div className="flex gap-2">
                    {index > 0 && (
                        <Button variant="outline" className="cursor-pointer" onClick={() => setIndex(index - 1)}>
                            <ChevronLeft />
                            Indietro
                        </Button>
                    )}
                    {last ? (
                        <Button className="cursor-pointer" onClick={onClose}>
                            Inizia
                        </Button>
                    ) : (
                        <Button className="cursor-pointer" onClick={() => setIndex(index + 1)}>
                            Avanti
                            <ChevronRight />
                        </Button>
                    )}
                </div>
            </DialogFooter>
        </>
    )
}

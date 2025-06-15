export interface Notation {
    id: string
    scoreId: string
    content: {
        annotations: Array<{
            id: string
            x: number
            y: number
            width: number
            height: number
            text: string
            pageNumber: number
        }>
        drawPoints: Array<{
            pageNumber: number
            color: string
            points: Array<{x: number, y: number}>
        }>
    }
}
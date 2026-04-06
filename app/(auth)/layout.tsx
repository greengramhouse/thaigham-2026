export default function authLayout({
    children
    }: {children: React.ReactNode}) {
    return (
        <div className="flex min-h-svh w-full items-center justify-center">
            {children}
        </div>
    )
}

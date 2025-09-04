export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Cargando...</h2>
            <p className="text-gray-600">Procesando tu solicitud</p>
          </div>
        </div>
      </div>
    </div>
  )
}

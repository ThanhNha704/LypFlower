// src/components/product/ProductSpecs.jsx
// Thông tin bó hoa

export default function ProductSpecs({ product }) {

    const flowerType = product?.flowerType
    const color = product?.color
    const occasion = product?.occasion
    const size = product?.bouquetSize
    const weight = product?.weightKg

    const specs = [
        { label: "Loại hoa", value: flowerType || "—" },
        { label: "Dịp tặng", value: occasion || "—" },
        { label: "Kích thước bó", value: size || "—" },
        { label: "Khối lượng", value: weight ? `${weight} kg` : "—" }
    ]

    return (
        <div className="rounded-xl border border-gray-200 overflow-hidden">

            <div className="bg-pink-50 px-4 py-2 font-semibold text-gray-700">
                Thông tin bó hoa
            </div>

            <table className="w-full text-sm">

                <tbody>

                    {specs.map(({ label, value }) => (

                        <tr key={label} className="border-t border-gray-100">

                            <td className="px-4 py-2 text-gray-500 w-1/2">
                                {label}
                            </td>

                            <td className="px-4 py-2 font-medium text-gray-800">
                                {value}
                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>
    )
}
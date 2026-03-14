import { Select, SelectItem } from "@heroui/react";

export default function HierarchySelector({
  categories,
  productTypes,
  brands,
  items,
  value,
  onChange,
}) {
  const selectedCategory = value.categoryId;
  const selectedProductType = value.productTypeId;
  const filteredPT = productTypes.filter((x) => x.category_id === selectedCategory);

  const availableBrandIds = new Set(
    items
      .filter(
        (x) =>
          x.category_id === selectedCategory &&
          x.product_type_id === selectedProductType
      )
      .map((x) => x.brand_id)
  );

  const filteredBrands = brands.filter((b) => availableBrandIds.has(b.id));

  const filteredItems = items.filter(
    (x) =>
      x.category_id === selectedCategory &&
      x.product_type_id === selectedProductType &&
      x.brand_id === value.brandId
  );

  const selectClass = {
    trigger: "border-[#E3E8EF] dark:border-[#1E3A5F] bg-white dark:bg-[#0D1B2E]/50 hover:border-[#635BFF] data-[focus=true]:border-[#635BFF] rounded-md h-9",
    value: "text-sm text-[#1A1F36] dark:text-[#C9D7E8]",
    label: "text-sm text-[#697386] dark:text-[#7B93AE]",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <Select
        label="Category"
        size="sm"
        variant="bordered"
        selectedKeys={value.categoryId ? [value.categoryId] : []}
        onChange={(e) =>
          onChange({ categoryId: e.target.value, productTypeId: "", brandId: "", itemId: "" })
        }
        classNames={selectClass}
      >
        {categories.map((c) => (
          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
        ))}
      </Select>

      <Select
        label="Product Type"
        size="sm"
        variant="bordered"
        isDisabled={!value.categoryId}
        selectedKeys={value.productTypeId ? [value.productTypeId] : []}
        onChange={(e) => onChange({ ...value, productTypeId: e.target.value, brandId: "", itemId: "" })}
        classNames={selectClass}
      >
        {filteredPT.map((pt) => (
          <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
        ))}
      </Select>

      <Select
        label="Brand"
        size="sm"
        variant="bordered"
        isDisabled={!value.productTypeId}
        selectedKeys={value.brandId ? [value.brandId] : []}
        onChange={(e) => onChange({ ...value, brandId: e.target.value, itemId: "" })}
        classNames={selectClass}
      >
        {filteredBrands.map((b) => (
          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
        ))}
      </Select>

      <Select
        label="Model"
        size="sm"
        variant="bordered"
        isDisabled={!value.brandId}
        selectedKeys={value.itemId ? [value.itemId] : []}
        onChange={(e) => onChange({ ...value, itemId: e.target.value })}
        classNames={selectClass}
      >
        {filteredItems.map((item) => (
          <SelectItem key={item.id} value={item.id}>{item.model_number}</SelectItem>
        ))}
      </Select>
    </div>
  );
}

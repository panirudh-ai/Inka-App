import { Grid2 as Grid, MenuItem, TextField } from "@mui/material";

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

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField
          select
          label="Category"
          fullWidth
          value={value.categoryId || ""}
          onChange={(e) =>
            onChange({ categoryId: e.target.value, productTypeId: "", brandId: "", itemId: "" })
          }
        >
          {categories.map((c) => (
            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField
          select
          label="Product Type"
          fullWidth
          value={value.productTypeId || ""}
          onChange={(e) => onChange({ productTypeId: e.target.value, brandId: "", itemId: "" })}
          disabled={!value.categoryId}
        >
          {filteredPT.map((pt) => (
            <MenuItem key={pt.id} value={pt.id}>{pt.name}</MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField
          select
          label="Brand"
          fullWidth
          value={value.brandId || ""}
          onChange={(e) => onChange({ brandId: e.target.value, itemId: "" })}
          disabled={!value.productTypeId}
        >
          {filteredBrands.map((b) => (
            <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField
          select
          label="Model"
          fullWidth
          value={value.itemId || ""}
          onChange={(e) => onChange({ itemId: e.target.value })}
          disabled={!value.brandId}
        >
          {filteredItems.map((item) => (
            <MenuItem key={item.id} value={item.id}>{item.model_number}</MenuItem>
          ))}
        </TextField>
      </Grid>
    </Grid>
  );
}

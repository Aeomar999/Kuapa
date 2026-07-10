import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Alert, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCreateProduct, useUpdateProduct } from "@/lib/hooks/use-vendor";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import { useState } from "react";
import { uploadApi } from "@/lib/api/upload";
import { useFormValidation } from "@/lib/hooks/use-form-validation";
import { productSchema } from "@/lib/validation/schemas";

export default function AddProductScreen() {
  const router = useRouter();
  const { mode, id } = useLocalSearchParams();
  const isEdit = mode === "edit";

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const insets = useSafeAreaInsets();
  const [name, setName] = useState(isEdit ? "Fresh Akumadan Tomatoes (Grade A)" : "");
  const [category, setCategory] = useState(isEdit ? "Tomatoes" : "");
  const [description, setDescription] = useState(
    isEdit
      ? "Freshly harvested red tomatoes from Akumadan farming cooperative. Firm texture, excellent for storage and transport."
      : ""
  );
  const [price, setPrice] = useState(isEdit ? "120.00" : "");
  const [comparePrice, setComparePrice] = useState("");
  const [quantity, setQuantity] = useState(isEdit ? "45" : "");
  const [sku, setSku] = useState(isEdit ? "TOM-AKM-01" : "");
  const [unit, setUnit] = useState("CRATE");
  const [shelfLifeDays, setShelfLifeDays] = useState(isEdit ? "5" : "");
  const [shippingRequired, setShippingRequired] = useState(true);

  const [localImages, setLocalImages] = useState<
    { uri: string; type: string; name: string; url?: string }[]
  >([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const { validate, errors } = useFormValidation(productSchema);

  const loading = createMutation.isPending || updateMutation.isPending || uploadingImages;

  const handleSubmit = async (status: "active" | "draft") => {
    const stockNum = quantity ? parseInt(quantity, 10) : 0;
    const priceNum = parseFloat(price);

    if (
      !validate({
        name,
        category,
        description,
        price: isNaN(priceNum) ? -1 : priceNum,
        stock: isNaN(stockNum) ? -1 : stockNum,
      })
    ) {
      Alert.alert("Validation Error", "Please check your inputs.");
      return;
    }

    try {
      setUploadingImages(true);
      const uploadedImages = [];
      for (const img of localImages) {
        if (img.url) {
          uploadedImages.push({ url: img.url });
        } else {
          const res = await uploadApi.uploadFile({ uri: img.uri, name: img.name, type: img.type });
          uploadedImages.push({ url: res.url });
        }
      }

      const formData = {
        name,
        category,
        description,
        price: parseFloat(price),
        stock: quantity ? parseInt(quantity, 10) : 0,
        unit,
        shelfLifeDays: shelfLifeDays ? parseInt(shelfLifeDays, 10) : null,
        images: uploadedImages,
      };

      if (isEdit) {
        updateMutation.mutate(
          { ...formData, id },
          {
            onSuccess: () => {
              Alert.alert("Updated", "Product updated successfully!");
              router.back();
            },
            onError: () => Alert.alert("Error", "Failed to update product."),
            onSettled: () => setUploadingImages(false),
          }
        );
      } else {
        createMutation.mutate(formData, {
          onSuccess: () => {
            Alert.alert("Published", "Product published successfully!");
            router.back();
          },
          onError: () => Alert.alert("Error", "Failed to create product."),
          onSettled: () => setUploadingImages(false),
        });
      }
    } catch (error) {
      setUploadingImages(false);
      Alert.alert("Error", "Failed to upload images. Please try again.");
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Custom Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <BackButton className="mr-3" />
        <Text className="text-display-sm font-heading font-black text-foreground">
          {isEdit ? "Edit Product" : "Add Product"}
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="pb-12 pt-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Image Upload Area */}
        <PhotoPicker
          images={localImages}
          onChange={setLocalImages}
          maxSelections={5}
          allowsMultipleSelection={true}
        />

        <View className="gap-5">
          <View>
            <Text className="text-body-lg font-bold text-foreground mb-4">Basic Details</Text>
            <View className="gap-4">
              <Input
                label="Produce Name"
                placeholder="e.g. Fresh Akumadan Tomatoes (Grade A)"
                value={name}
                onChangeText={setName}
                error={errors.name}
              />
              <Input
                label="Crop Category"
                placeholder="e.g. Tomatoes, Peppers, Okra"
                value={category}
                onChangeText={setCategory}
                error={errors.category}
              />
              <Input
                label="Description"
                placeholder="Describe your product..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                error={errors.description}
              />
            </View>
          </View>

          <View className="h-px bg-secondary my-2" />

          <View>
            <Text className="text-body-lg font-bold text-foreground mb-4">Pricing</Text>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Input
                  label="Price (GHS)"
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={price}
                  onChangeText={setPrice}
                  error={errors.price}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Produce Unit"
                  placeholder="e.g. CRATE, KG, BASKET"
                  value={unit}
                  onChangeText={setUnit}
                />
              </View>
            </View>
          </View>

          <View className="h-px bg-secondary my-2" />

          <View>
            <Text className="text-body-lg font-bold text-foreground mb-4">Inventory</Text>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Input
                  label="Quantity in Stock"
                  placeholder="0"
                  keyboardType="number-pad"
                  value={quantity}
                  onChangeText={setQuantity}
                  error={errors.stock}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Shelf Life (Days)"
                  placeholder="e.g. 5"
                  keyboardType="number-pad"
                  value={shelfLifeDays}
                  onChangeText={setShelfLifeDays}
                />
              </View>
            </View>
          </View>

          <View className="h-px bg-secondary my-2" />

          <View>
            <Text className="text-body-lg font-bold text-foreground mb-4">Shipping</Text>
            <Pressable
              onPress={() => setShippingRequired(!shippingRequired)}
              className="flex-row items-center justify-between p-4 bg-card rounded-xl border border-border"
            >
              <View>
                <Text className="text-body-lg font-bold text-foreground">Physical Product</Text>
                <Text className="text-sm text-muted-foreground mt-1">
                  This item requires shipping
                </Text>
              </View>
              <View
                className={`w-12 h-7 rounded-full p-1 ${shippingRequired ? "bg-primary" : "bg-secondary"}`}
              >
                <View
                  className={`w-5 h-5 rounded-full bg-card ${shippingRequired ? "translate-x-5" : "translate-x-0"}`}
                />
              </View>
            </Pressable>
          </View>

          <View className="mt-6 gap-3">
            <Button
              title={
                uploadingImages
                  ? "Uploading Photos..."
                  : isEdit
                    ? "Update Product"
                    : "Publish Product"
              }
              size="lg"
              loading={loading}
              onPress={() => handleSubmit("active")}
              className="w-full"
            />
            <Pressable
              onPress={() => handleSubmit("draft")}
              className="w-full py-4 items-center rounded-full border border-border bg-card"
              disabled={loading}
            >
              <Text className="text-body-lg font-bold text-muted-foreground">Save as Draft</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

import { FieldApi } from "@tanstack/react-form";
import { View, Text } from "react-native";

export default function FieldInfo({
  field,
}: {
  field: FieldApi<any, any, any, any>;
}) {
  return (
    <View>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <Text className="text-red-500 text-sm mt-1">
          {field.state.meta.errors.join(",")}
        </Text>
      ) : null}
      {/* {field.state.meta.isValidating ? "Validating..." : null} */}
    </View>
  );
}

import { FieldApi } from "@tanstack/react-form";
import { View, Text } from "react-native";

export default function FieldInfo({
  field,
  showErrors = false,
}: {
  field: FieldApi<any, any, any, any>;
  showErrors?: boolean;
}) {
  return (
    <View>
      {(field.state.meta.isTouched || showErrors) &&
      field.state.meta.errors.length ? (
        <Text className="text-rose-500 text-sm mt-1">
          {field.state.meta.errors.join(",")}
        </Text>
      ) : null}
      {/* {field.state.meta.isValidating ? "Validating..." : null} */}
    </View>
  );
}

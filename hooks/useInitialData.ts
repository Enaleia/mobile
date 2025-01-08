import { useActions } from "@/hooks/useActions";
import { useMaterials } from "@/hooks/useMaterials";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useCollectors } from "@/hooks/useCollectors";
import { useProducts } from "@/hooks/useProducts";

interface InitialDataState {
  isLoading: boolean;
  error: Error | null;
  progress: {
    user: boolean;
    actions: boolean;
    materials: boolean;
    collectors: boolean;
    products: boolean;
  };
  isComplete: boolean;
}

export function useInitialData(): InitialDataState {
  const { isLoading: userLoading, error: userError } = useUserInfo();
  const { isLoading: actionsLoading, error: actionsError } = useActions();
  const { isLoading: materialsLoading, error: materialsError } = useMaterials();
  const { isLoading: collectorsLoading, error: collectorsError } =
    useCollectors();
  const { isLoading: productsLoading, error: productsError } = useProducts();

  const isLoading =
    userLoading ||
    actionsLoading ||
    materialsLoading ||
    collectorsLoading ||
    productsLoading;

  const error =
    userError ||
    actionsError ||
    materialsError ||
    collectorsError ||
    productsError;

  const progress = {
    user: !userLoading && !userError,
    actions: !actionsLoading && !actionsError,
    materials: !materialsLoading && !materialsError,
    collectors: !collectorsLoading && !collectorsError,
    products: !productsLoading && !productsError,
  };

  return {
    isLoading,
    error,
    progress,
    isComplete: Object.values(progress).every(Boolean),
  };
}

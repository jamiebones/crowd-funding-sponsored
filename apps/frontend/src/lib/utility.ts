import { categories } from "@/app/constant/categories";

const isPdf = (url: string = "") => {
    const spString = url.split(":");
    if (spString && spString[1].includes("pdf")) {
      return true;
    }
    return false;
  };

 const getCampaignCategories = (category: number) => {
    return categories.find((c) => c.value === category)?.name;
 }

  export { isPdf, getCampaignCategories };
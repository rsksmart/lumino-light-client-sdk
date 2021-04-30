const getLuminoData = () => {
  const data = JSON.parse(localStorage.getItem("lumino"));
  if (!data) {
    return {};
  }
  return data;
};

const saveLuminoData = data =>
  localStorage.setItem("lumino", JSON.stringify(data));

export default {
  getLuminoData,
  saveLuminoData,
};

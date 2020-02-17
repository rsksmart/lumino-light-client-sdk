const getLuminoData = () => {
  let data = JSON.parse(localStorage.getItem("lumino"));
  return data;
};

const saveLuminoData = data =>
  localStorage.setItem("lumino", JSON.stringify(data));

export default {
  getLuminoData,
  saveLuminoData,
};

export const formatTimeStampToDate = (timeStamp) => {
  const date = new Date(timeStamp);
  return date.toLocaleDateString("de-de", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
};

export const formatTimeStampToTime = (timeStamp) => {
  const date = new Date(timeStamp);
  return date.toLocaleTimeString("de-de");
};

export const formatTimeStampToDateAndTime = (timeStamp) => {
  const date = formatTimeStampToDate(timeStamp);
  const time = formatTimeStampToTime(timeStamp);
  return `${date} ${time}`;
};

import { Settings, DateTime } from "luxon";
import axios from "axios";
import Handlebars from "handlebars";
import he from "he";
import sendgrid from "@sendgrid/client";

declare var process: {
  env: {
    SENDGRID_API_KEY: string;
  };
};

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

Settings.defaultZoneName = "Australia/Darwin";

async function getData() {
  const response = await axios.request({
    method: "GET",
    url: "https://parksaustralia.gov.au/kakadu/access/feed.xml",
  });

  return response.data as string;
}

async function getTemplate() {
  const response = await sendgrid.request({
    method: "GET",
    url: "/v3/designs/3aaf2986-a36d-4a7d-883b-28cb497eb56f",
  });
  return response[1].html_content;
}

async function postSingleSend(htmlContent: String, formattedDate: String) {
  const response = await sendgrid.request({
    method: "POST",
    url: "/v3/marketing/singlesends",
    body: JSON.stringify({
      email_config: {
        editor: "design",
        generate_plain_content: false,
        html_content: htmlContent,
        sender_id: 1119454,
        subject: `Kakadu access report: ${formattedDate}`,
        suppression_group_id: 15891,
      },
      name: `Kakadu access report - ${formattedDate}`,
      send_to: {
        list_ids: ["fc55886e-c778-41d8-a0d8-83cde65deaa2"],
      },
      status: "scheduled",
    }),
  });

  return response;
}

async function scheduleSingleSend(messageId: String, sendAt: String) {
  const response = await sendgrid.request({
    method: "PUT",
    url: `/v3/marketing/singlesends/${messageId}/schedule`,
    body: JSON.stringify({ send_at: sendAt }),
  });

  return response;
}

export async function handler() {
  const date = DateTime.local();
  const formattedDate = date.toFormat("d MMMM yyyy");

  let xml: string;
  try {
    xml = await getData();
  } catch (error) {
    console.log("Failed to download data from parksaustralia.gov.au:");
    console.log(error);
    return false;
  }

  const regex = /<content type="html">([\s\S]*?)<\/content>/g;
  const rawHtml = regex.exec(xml);

  if (rawHtml == null) {
    console.log("Failed to parse XML");
    return false;
  }

  const html = he.decode(rawHtml[1]);

  let template: String;
  try {
    template = await getTemplate();
  } catch (error) {
    console.log("Failed to download template:");
    console.log(error);
    return false;
  }

  let handlebars: HandlebarsTemplateDelegate;
  let htmlContent: String;

  try {
    handlebars = Handlebars.compile(template);
    htmlContent = handlebars({ formattedDate, html });
  } catch (error) {
    console.log("Failed to compile template:");
    console.log(error);
    return false;
  }

  let singleSendResponse;

  try {
    singleSendResponse = await postSingleSend(htmlContent, formattedDate);
  } catch (error) {
    console.log("Failed to post single send to SendGrid:");
    console.log(error);
    return false;
  }

  type singleSendResponseBody = {
    id: String;
  };

  try {
    const messageId = (singleSendResponse[0].body as singleSendResponseBody).id;
    const sendAt = DateTime.local().startOf("day").plus({ hours: 3 }).toISO();
    const response = await scheduleSingleSend(messageId, sendAt);
  } catch (error) {
    console.log("Failed to schedule single send in SendGrid:");
    console.log(error);
    console.log(error?.response?.body?.errors);
    return false;
  }

  console.log("Done");
  return true;
}

handler();

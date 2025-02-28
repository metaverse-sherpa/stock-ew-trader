import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { DeepSeekService } from "@/lib/services/deepSeekService";
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
  MessageSquare,
} from "lucide-react";

interface StockSentimentProps {
  symbol: string;
}

const StockSentiment = ({ symbol }: StockSentimentProps) => {
  const [sentimentData, setSentimentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSentimentData = async () => {
      try {
        setLoading(true);
        const data = await DeepSeekService.getStockSentiment(symbol);
        setSentimentData(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to fetch sentiment data"),
        );
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchSentimentData();
    }
  }, [symbol]);

  if (loading) {
    return (
      <Card className="w-full bg-background border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Market Sentiment</span>
            <Badge variant="outline">Loading...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full bg-background border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Market Sentiment</span>
            <Badge variant="destructive">Error</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            Failed to load sentiment data: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!sentimentData) return null;

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <ArrowUpRight className="text-green-500" />;
      case "negative":
        return <ArrowDownRight className="text-red-500" />;
      default:
        return <Minus className="text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-500";
      case "negative":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <Card className="w-full bg-background border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Market Sentiment</span>
          <Badge
            variant={
              sentimentData.overallSentiment === "positive"
                ? "default"
                : sentimentData.overallSentiment === "negative"
                  ? "destructive"
                  : "secondary"
            }
          >
            {sentimentData.overallSentiment.charAt(0).toUpperCase() +
              sentimentData.overallSentiment.slice(1)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="news">
          <TabsList className="mb-4">
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="events">Upcoming Events</TabsTrigger>
          </TabsList>

          <TabsContent value="news" className="space-y-4">
            {sentimentData.news.map((item: any, index: number) => (
              <div
                key={index}
                className="border-b border-border pb-3 last:border-0"
              >
                <div className="flex items-start justify-between">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline"
                  >
                    {item.title}
                  </a>
                  <div className="flex items-center gap-1">
                    {getSentimentIcon(item.sentiment)}
                    <span className={getSentimentColor(item.sentiment)}>
                      {item.sentiment.charAt(0).toUpperCase() +
                        item.sentiment.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {item.source} • {new Date(item.date).toLocaleDateString()}
                </div>
                <p className="text-sm mt-2">{item.summary}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            {sentimentData.socialMedia.map((item: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between border-b border-border pb-3 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="font-medium">{item.source}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm">{item.count} mentions</span>
                  <div className="flex items-center gap-1">
                    {getSentimentIcon(item.sentiment)}
                    <span className={getSentimentColor(item.sentiment)}>
                      {item.sentiment.charAt(0).toUpperCase() +
                        item.sentiment.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            {sentimentData.upcomingEvents.map((item: any, index: number) => (
              <div
                key={index}
                className="flex items-start gap-3 border-b border-border pb-3 last:border-0"
              >
                <Calendar className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">{item.type}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(item.date).toLocaleDateString()}
                  </div>
                  <p className="text-sm mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StockSentiment;
